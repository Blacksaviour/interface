// Generated from apps/docs/content/resources/faq.mdx. Do not edit.
export const LANDING_FAQS = [
  {
    "id": "what-is-so4",
    "question": "What is SO4?",
    "answer": "SO4 is a perpetual-markets protocol on Stellar with a web interface for preparing and submitting transactions.",
    "linkLabel": "Read the protocol risk overview",
    "href": "/concepts/risk"
  },
  {
    "id": "self-custody",
    "question": "Do I keep custody of my assets?",
    "answer": "The interface does not hold wallet keys; your wallet signs transactions and protocol contracts account for deposited collateral.",
    "linkLabel": "Read the interface and protocol distinction",
    "href": "/resources/terms#interface-and-protocol"
  },
  {
    "id": "liquidation",
    "question": "What can cause liquidation?",
    "answer": "A position becomes liquidatable when its remaining collateral no longer meets the protocol's maintenance-margin requirement.",
    "linkLabel": "Read the liquidation mechanics",
    "href": "/concepts/liquidation"
  },
  {
    "id": "fees",
    "question": "What fees will I pay?",
    "answer": "Costs can include opening, closing, funding, borrowing, network, and price-impact amounts, depending on the transaction.",
    "linkLabel": "Read about funding and fees",
    "href": "/concepts/funding-and-fees"
  },
  {
    "id": "availability",
    "question": "Is the interface always available?",
    "answer": "No; deployments, incidents, RPC failures, congestion, and local connectivity can interrupt the website even while the protocol remains deployed.",
    "linkLabel": "Read the risk overview",
    "href": "/concepts/risk"
  }
] as const
