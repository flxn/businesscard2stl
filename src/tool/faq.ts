import type { FaqEntry } from '@/core/tool';

/** FAQ entries (i18n keys); shown below the workbench and published as FAQPage structured data. */
const faq: FaqEntry[] = [
  { question: 'faq.sizeQuestion', answer: 'faq.sizeAnswer' },
  { question: 'faq.qrQuestion', answer: 'faq.qrAnswer' },
  { question: 'faq.textQuestion', answer: 'faq.textAnswer' },
  { question: 'coreFaq.multicolorQuestion', answer: 'coreFaq.multicolorAnswer' },
  { question: 'coreFaq.formatsQuestion', answer: 'coreFaq.formatsAnswer' },
  { question: 'coreFaq.privacyQuestion', answer: 'coreFaq.privacyAnswer' },
];

export default faq;
