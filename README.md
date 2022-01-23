# @aster-elements/tooltip

### HTML declaration
```html
<div id="target">Hey! Do a mouse over to show the tooltip</div>

<aster-tooltip default-position="bottom" default-align="center" distance="20"></aster-tooltip>
```
> To ensure the tooltip will be always on top, put this element at the end of the body or at the end of its scope.

### Example of CSS customisation
```css
aster-tooltip {
    background-color: rgb(230, 173, 67);
    color: #fff;
}
```

### Usage
```ts
import { Tooltip } from "@aster-elements/tooltip";

Tooltip.get().for("#target", "This is a beautiful custom tooltip")
```

## Reference
- `Tooltip.get(name?)`: Retreive the tooltip instance.

## Properties
- `defaultPosition`: Define the fallback when position is not provided when showing the tooltip.
- `defaultAlign`: Define the fallback when align is not provided when showing the tooltip.
- `distance`: Define the distance in pixel of the tooltip from the target element.
- `autoHide`: Indicate whether or not the tooltip should disappear when mouse leave the targeted element.
- `delay`: Define a debounce delay use when auto hide the tooltip.

## Methods
- `for(targetOrQuerySelector, content, options?)`: Attach a tooltip with the provided element, element list or query selector that will appear when the mouse is over the element.
- `show(eventOrTarget, content, options?)`: Show the tooltip for the provided element or the element origin to a UI Event.

## TooltipOpeningOptions
- `position`: Define the position arround the tooltip.
- `align`: Define the alignment of the position.
- `cssClass`: Define a custom css class.
- `autoHide`: Indiquate whether or not the tooltip should disappear when mouse out.

## TooltipAlign
- `start`: Align the tooltip at the start of the position e.g. top position => align left, left position => top align.
- `center`: Align the tooltip the center of the position.
- `end`: Align the tooltip at the end of the position e.g. top position => align right, left position => bottom align

## TooltipPosition
Possible values: `top`, `left`, `bottom`, `right`
