import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import {Button} from "./button";

describe("Button", () => {
    it("renders its children as an accessible button", () => {
        render(<Button>Save changes</Button>);
        expect(
            screen.getByRole("button", {name: "Save changes"})
        ).toBeInTheDocument();
    });

    it("reflects the variant via data-variant", () => {
        render(<Button variant="destructive">Delete</Button>);
        expect(screen.getByRole("button", {name: "Delete"})).toHaveAttribute(
            "data-variant",
            "destructive"
        );
    });

    it("renders as a child element when asChild is set", () => {
        render(
            <Button asChild>
                <a href="/home">Home</a>
            </Button>
        );
        expect(screen.getByRole("link", {name: "Home"})).toBeInTheDocument();
    });
});
