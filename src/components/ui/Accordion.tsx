import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type BaseAccordionProps = {
  className?: string;
  children?: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
};

type SingleAccordionProps = BaseAccordionProps & {
  type: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

type MultipleAccordionProps = BaseAccordionProps & {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

type AccordionProps = SingleAccordionProps | MultipleAccordionProps;

const AccordionRoot = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionProps
>((props, ref) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = React.useState(0);
  const [openPanels, setOpenPanels] = React.useState<string[]>([]);

  React.useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };

    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    return () => window.removeEventListener('resize', updateContainerHeight);
  }, []);

  const handleValueChange = (value: string | string[]) => {
    const valueArray = Array.isArray(value) ? value : [value];
    setOpenPanels(valueArray);
    
    if (props.onValueChange) {
      if (props.type === "multiple") {
        (props.onValueChange as (value: string[]) => void)(valueArray);
      } else {
        (props.onValueChange as (value: string) => void)(valueArray[0] || "");
      }
    }
  };

  return (
    <div ref={containerRef} className={props.className}>
      <AccordionPrimitive.Root
        {...props}
        ref={ref}
        onValueChange={handleValueChange}
      >
        {React.Children.map(props.children, (child, index) => {
          if (!React.isValidElement(child)) return child;
          
          let dynamicHeight;
          if (index === 0) {
            const totalFixedHeight = openPanels.length * (child.props.fixedHeight || 0);
            dynamicHeight = Math.max(containerHeight - totalFixedHeight, 0);
          }

          return React.cloneElement(child, {
            ...child.props,
            fixedHeight: index === 0 ? dynamicHeight : child.props.fixedHeight,
            isFirstPanel: index === 0,
            openPanels
          });
        })}
      </AccordionPrimitive.Root>
    </div>
  );
});
AccordionRoot.displayName = "Accordion";

interface AccordionItemProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  fixedHeight?: string | number;
  isFirstPanel?: boolean;
  openPanels?: string[];
}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, fixedHeight, isFirstPanel, openPanels, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
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

interface AccordionContentProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  fixedHeight?: string | number;
  isFirstPanel?: boolean;
  openPanels?: string[];
}

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, children, fixedHeight, isFirstPanel, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    style={{
      height: fixedHeight,
      maxHeight: isFirstPanel ? 'none' : fixedHeight
    }}
    {...props}
  >
    <div className="h-full overflow-auto">{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export {
  AccordionRoot as Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
};