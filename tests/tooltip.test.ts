import { assert } from "chai";
import { Tooltip } from "../src";

describe("Tooltip", () => {

    it("Should create an instance of Tooltip using tag name", async () => {
        const instance = document.createElement("aster-tooltip");

        assert.instanceOf(instance, Tooltip);
        assert.isUndefined(Tooltip.get());
    });

    it("Should register an instance when connected to the dom", async () => {
        const instance = document.createElement("aster-tooltip");
        document.body.appendChild(instance);

        const result = Tooltip.get();
        assert.equal(instance, result);
    });

    it("Should register a named instance when connected to the dom", async () => {
        const instance = document.createElement("aster-tooltip");
        instance.setAttribute("name", "bob");

        document.body.appendChild(instance);

        const result = Tooltip.get("bob");
        assert.equal(instance, result);
    });

});
