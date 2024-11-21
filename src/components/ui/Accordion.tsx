import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionPrimitive.AccordionMultipleProps | AccordionPrimitive.AccordionSingleProps
>((props, ref) => {
  const { className, ...rootProps } = props;

  return (
    <AccordionPrimitive.Root
      ref={ref}
      className={cn("flex flex-col gap-2", className)}
      {...rootProps}
    />
  );
});
Accordion.displayName = "Accordion";

interface AccordionItemProps extends Omit<
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
  'children'
> {
  children?: React.ReactNode;
  fixedContentHeight?: string | number;
}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, children, fixedContentHeight, ...props }, ref) => {
  // Pass fixedContentHeight through data attribute
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn("bg-gray-800 rounded-md overflow-hidden", className)}
      data-fixed-height={fixedContentHeight}
      {...props}
    >
      {children}
    </AccordionPrimitive.Item>
  );
});
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header>
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex w-full items-center justify-between px-4 py-2 bg-gray-700 hover:bg-gray-700 transition-all",
        "[&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

interface AccordionContentProps extends Omit<
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>,
  'children'
> {
  children?: React.ReactNode;
}

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, children, style, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (contentRef.current) {
      const item = contentRef.current.closest('[data-fixed-height]');
      if (item instanceof HTMLElement) {
        setHeight(item.dataset.fixedHeight || undefined);
      }
    }
  }, []);

  const contentStyle: React.CSSProperties = {
    ...style,
    ...(height ? { height } : {})
  };

  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden transition-all",
        "data-[state=closed]:animate-accordion-up",
        "data-[state=open]:animate-accordion-down",
        className
      )}
      style={contentStyle}
      {...props}
    >
      <div ref={contentRef} className="h-full overflow-auto">
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionItemProps,
};