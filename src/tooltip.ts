import { IDisposable } from "@aster-js/core";
import { AbortToken, Debouncer, TimeoutSource } from "@aster-js/async";
import { dom } from "@aster-js/dom";
import { LitElement, html, HTMLTemplateResult, unsafeCSS, nothing, render } from "lit";
import { customElement, property } from "lit/decorators.js";
import styles from "./tooltip.css";

const aligns = ["start", "center", "end"] as const;
export type TooltipAlign = typeof aligns[number];

const positions = ["top", "left", "bottom", "right"] as const;
export type TooltipPosition = typeof positions[number];

export type TooltipOpeningOptions = {
    readonly position?: TooltipPosition;
    readonly align?: TooltipAlign;
    readonly cssClass?: string;
    readonly autoHide?: boolean;
}

const instances = new Map();

@customElement("aster-tooltip")
export class Tooltip extends LitElement {
    private readonly _mouseMoveDebouncer: Debouncer<[MouseEvent], void>;
    private readonly _mouseOutTimeout: TimeoutSource;
    private readonly _onMouseMoveHandler: (ev: MouseEvent) => void;
    private readonly _registered: IDisposable[] = [];
    private _debouncedTime: number = 0;
    private _content: unknown = nothing;
    private _target: HTMLElement | null = null;
    private _options: TooltipOpeningOptions | null = null;

    static readonly styles = unsafeCSS(styles);

    static get(name?: string): Tooltip {
        if (name) {
            return instances.get(name.toLowerCase());
        }

        let defaultInstance = instances.get("default");
        if (!defaultInstance) {
            defaultInstance = document.createElement("aster-tooltip");
            document.body.appendChild(defaultInstance);
            instances.set("default", defaultInstance);
        }
        return defaultInstance;
    }

    @property({ type: String, attribute: "default-align" })
    defaultAlign: TooltipAlign = "center";

    @property({ type: String, attribute: "default-position" })
    defaultPosition: TooltipPosition = "bottom";

    @property({ type: Number })
    distance: number = 5;

    @property({ type: Number })
    delay: number = 600;

    @property({ type: Boolean, attribute: "auto-hide" })
    autoHide: boolean = false;

    constructor() {
        super();
        this._mouseMoveDebouncer = new Debouncer(async ev => this.onMouseMove(ev), { delay: 100, overdue: 300 });
        this._mouseOutTimeout = new TimeoutSource();
        this._onMouseMoveHandler = ev => this._mouseMoveDebouncer.tryInvoke(ev);
    }

    isOpen(): boolean {
        return Boolean(this._target);
    }

    connectedCallback(): void {
        super.connectedCallback();

        const name = this.getName();
        instances.set(name, this);

        this._registered.push(
            dom.on(document.body, "mousemove", this._onMouseMoveHandler as EventListener, { passive: true }),
            dom.on(document.body, "wheel", () => this.hide(), { passive: true })
        );
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();

        const name = this.getName();
        if (instances.get(name) === this) instances.delete(name);

        IDisposable.safeDisposeAll(this._registered.splice(0));
    }

    private getName(): string {
        return this.getAttribute("name")?.toLowerCase() || "default";
    }

    private onMouseMove(ev: MouseEvent): void {
        if ((this.autoHide || this._options?.autoHide) && this._target && this._debouncedTime < Date.now()) {
            if (dom.inBounds(this._target, ev.x, ev.y)) {
                this._mouseOutTimeout.clear();
            }
            else {
                const target = this._target;
                this._mouseOutTimeout.tryInvoke(() => this.hide(target), this.delay);
            }
        }
    }

    for<TElement extends HTMLElement>(targetOrQuerySelector: TElement | TElement[] | string, content: unknown, options?: TooltipOpeningOptions): void {
        this.showOn(targetOrQuerySelector, "mouseenter", content, options);
    }

    showOn<TElement extends HTMLElement>(targetOrQuerySelector: TElement | TElement[] | string, eventType: string, content: unknown, options: TooltipOpeningOptions = {}): void {
        for (const target of this.getTargets(targetOrQuerySelector)) {
            const listener = () => {
                this.show(target, content, { autoHide: true, ...options });
            };
            this._registered.push(
                dom.on(target, eventType, listener)
            );
        }
    }

    toggleOn<TElement extends HTMLElement>(targetOrQuerySelector: TElement | TElement[], eventType: string, content: unknown, options: TooltipOpeningOptions = {}): void {
        for (const target of this.getTargets(targetOrQuerySelector)) {
            const listener = () => {
                if (this._target === target) {
                    this.hide(target);
                    return false;
                }

                this.show(target, content, options);
                return true;
            };

            this._registered.push(
                dom.on(target, eventType, listener)
            );
        }
    }

    private *getTargets<TElement extends HTMLElement>(targetOrQuerySelector: TElement | TElement[] | string): Iterable<TElement> {
        if (Array.isArray(targetOrQuerySelector)) {
            yield* targetOrQuerySelector;
        }
        else if (typeof targetOrQuerySelector === "string") {
            yield* document.querySelectorAll(targetOrQuerySelector);
        }
        else {
            yield targetOrQuerySelector;
        }
    }

    async show(eventOrTarget: HTMLElement | UIEvent, content: unknown, options: TooltipOpeningOptions = {}): Promise<void> {
        const target = eventOrTarget instanceof HTMLElement ? eventOrTarget : eventOrTarget.target as HTMLElement;

        if (this._target) {
            if (this._target === target) return;
            this.hide();
        }

        this._target = target;
        this._content = this.resolveContent(target, content);
        this._options = options;
        this._debouncedTime = Date.now() + this.delay;

        await this.updateComplete;

        if (this._target !== target) return;

        if (options.cssClass) {
            this.classList.add(options.cssClass);
        }
        this.style.display = "block";
        render(this._content, this);

        const [top, left] = this.getPosition(target, options.position ?? this.defaultPosition, options.align ?? this.defaultAlign);
        Object.assign(this.style, { top, left });
        this.classList.add("aster-tooltip--visible");
    }

    async toggle(target: HTMLElement | UIEvent, content: unknown, options?: TooltipOpeningOptions): Promise<boolean> {
        if (this._target === target) {
            this.hide(target);
            return false;
        }
        await this.show(target, content, options);
        return true;
    }

    private resolveContent(element: HTMLElement, content: unknown): unknown {
        if (typeof content === "function") {
            return content(element);
        }
        return content;
    }

    private getPosition(target: HTMLElement, position: TooltipPosition, align: TooltipAlign): [top: string, left: string] {
        const tooltipRect = this.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        let xy = this.getPositionCore(targetRect, tooltipRect, position, align);

        let rect = new DOMRect(...xy, tooltipRect.width, tooltipRect.height);
        if (!dom.isVisible(rect)) {
            const sides = positions.filter(x => x !== position);
            do {
                position = sides.pop()!;
                xy = this.getPositionCore(targetRect, tooltipRect, position, align);
                rect = new DOMRect(...xy, tooltipRect.width, tooltipRect.height);
            }
            while (sides.length && !dom.isVisible(rect));
        }
        return [`${Math.round(xy[1])}px`, `${Math.round(xy[0])}px`];
    }

    private getPositionCore(targetRect: DOMRect, tooltipRect: DOMRect, position: TooltipPosition, align: TooltipAlign): [number, number] {
        let top = 0, left = 0;
        switch (position) {
            case "top":
                top = targetRect.top - tooltipRect.height - this.distance;
                left = this.getHorizontalAlignPosition(align, targetRect, tooltipRect);
                break;
            case "left":
                top = this.getVerticalAlignPosition(align, targetRect, tooltipRect);
                left = targetRect.left - tooltipRect.width - this.distance;
                break;
            case "bottom":
                top = targetRect.bottom + this.distance;
                left = this.getHorizontalAlignPosition(align, targetRect, tooltipRect);
                break;
            case "right":
                top = this.getVerticalAlignPosition(align, targetRect, tooltipRect);
                left = targetRect.right + this.distance;
                break;
        }
        return [left, top];
    }

    private getHorizontalAlignPosition(align: TooltipAlign, targetRect: DOMRect, tooltipRect: DOMRect) {
        switch (align) {
            case "start":
                return targetRect.left;
            case "center":
                return targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
            case "end":
                return targetRect.right - tooltipRect.width;
        }
    }

    private getVerticalAlignPosition(align: TooltipAlign, targetRect: DOMRect, tooltipRect: DOMRect) {
        switch (align) {
            case "start":
                return targetRect.top;
            case "center":
                return targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
            case "end":
                return targetRect.bottom - tooltipRect.height;
        }
    }

    hide(target?: HTMLElement): void {
        if (this._target && (!target || this._target === target)) {
            this.classList.remove("aster-tooltip--visible");
            if (this._options?.cssClass) {
                this.classList.remove(this._options?.cssClass);
            }
            this.style.display = "none";

            this._target = null;
            this._options = null;
            this._content = nothing;
        }
    }

    protected render(): HTMLTemplateResult {
        return html`<div class="container"><slot></slot></div>`;
    }
}
