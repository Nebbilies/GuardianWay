import { Checkbox } from "radix-ui";
import { Check } from "lucide-react";
import type { ComponentProps } from "react";

export function CheckField(props: ComponentProps<typeof Checkbox.Root>) {
    return (
        <Checkbox.Root
            {...props}
            className="inline-grid size-5 shrink-0 place-items-center rounded border border-input bg-card data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        >
            <Checkbox.Indicator>
                <Check size={16} />
            </Checkbox.Indicator>
        </Checkbox.Root>
    );
}
