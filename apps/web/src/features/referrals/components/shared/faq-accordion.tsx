import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
  
} from "@workspace/ui/components/accordion"
import type {HeadingLevel} from "@workspace/ui/components/accordion";

export type FaqItem = {
  q: string
  a: string
}

type Props = {
  items: Array<FaqItem>
  title?: string
  headingLevel?: HeadingLevel
}

export function FaqAccordion({
  items,
  title = "FAQ",
  headingLevel = 3,
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-1 text-11 font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </p>
      <Accordion type="single" className="w-full">
        {items.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger headingLevel={headingLevel}>
              {item.q}
            </AccordionTrigger>
            <AccordionContent>
              <p>{item.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
