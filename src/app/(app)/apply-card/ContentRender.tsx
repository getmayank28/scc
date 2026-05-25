import Typography from '@/components/Typography/Typography';
import React from 'react';

interface ContentRendererProps {
  content: string;
}

interface SubsectionItem {
  type: 'subsection';
  title: string;
  content: string;
}

interface BulletItem {
  type: 'bullet';
  content: string;
}

type SectionItem = SubsectionItem | BulletItem;

interface SectionElement {
  type: 'section';
  title: string;
  items: SectionItem[];
  key: string;
}

interface IntroElement {
  type: 'intro';
  text: string;
  key: string;
}

interface StandaloneElement {
  type: 'standalone';
  title: string;
  content: string;
  key: string;
}

type ParsedElement = SectionElement | IntroElement | StandaloneElement;

const FIELD_LABELS: Record<string, string> = {
  cardName: 'Card Name',
  bankName: 'Bank',
  annualFee: 'Annual Fee',
  joiningFee: 'Joining Fee',
  netAnnualRewardLoss: 'Net Annual Reward Loss',
  returnOnSpend: 'Return on Spend',
  categoryWiseReward: 'Category-wise Reward',
  whyThisCard: 'Why this card',
  notIdealFor: 'Not ideal for',
  welcomeBenefits: 'Welcome Benefits',
  rewards: 'Rewards',
  features: 'Features',
  benefits: 'Benefits',
  eligibility: 'Eligibility',
  fees: 'Fees',
  perks: 'Perks',
  bestFor: 'Best for',
  loungeAccess: 'Lounge Access',
  fuelSurcharge: 'Fuel Surcharge Waiver',
  apr: 'APR',
};

const humanize = (key: string): string => {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
};

const tryParseJson = (text: string): unknown => {
  const trimmed = text.trim();
  // Strip fenced code blocks: ```json ... ```  or  ``` ... ```
  const fenced = trimmed.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  const candidates = [fenced];

  // Also try the first {...} / [...] block found anywhere in the text
  const objMatch = fenced.match(/\{[\s\S]*\}/);
  const arrMatch = fenced.match(/\[[\s\S]*\]/);
  if (objMatch) candidates.push(objMatch[0]);
  if (arrMatch) candidates.push(arrMatch[0]);

  for (const candidate of candidates) {
    if (!candidate || (candidate[0] !== '{' && candidate[0] !== '[')) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }
  return null;
};

const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(stringifyValue).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${humanize(k)}: ${stringifyValue(v)}`)
      .join(' · ');
  }
  return '';
};

const isPlainCardObject = (val: unknown): val is Record<string, unknown> =>
  typeof val === 'object' && val !== null && !Array.isArray(val);

const parseContent = (text: string): ParsedElement[] => {
  if (!text) return [];

  const lines = text.split('\n');
  const elements: ParsedElement[] = [];
  let currentSection: SectionElement | null = null;

  const flushSection = () => {
    if (currentSection) {
      elements.push(currentSection);
      currentSection = null;
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    if (line.startsWith('**') && line.endsWith('**') && !line.startsWith('* **')) {
      flushSection();
      currentSection = {
        type: 'section',
        title: line.replace(/\*\*/g, '').replace(/:$/, ''),
        items: [],
        key: `section-${index}`,
      };
      return;
    }

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      flushSection();
      currentSection = {
        type: 'section',
        title: headingMatch[1].replace(/\*\*/g, '').replace(/:$/, ''),
        items: [],
        key: `section-${index}`,
      };
      return;
    }

    const bulletMatch = line.match(/^[*-]\s+(.*)/);
    if (bulletMatch) {
      const content = bulletMatch[1];
      const boldMatch = content.match(/^\*\*(.*?)\*\*:?\s*(.*)/);

      if (boldMatch && boldMatch[1]) {
        const item: SubsectionItem = {
          type: 'subsection',
          title: boldMatch[1],
          content: boldMatch[2] ?? '',
        };
        if (currentSection) {
          currentSection.items.push(item);
        } else {
          elements.push({
            type: 'standalone',
            title: item.title,
            content: item.content,
            key: `standalone-${index}`,
          });
        }
        return;
      }

      if (currentSection) {
        currentSection.items.push({ type: 'bullet', content });
      } else {
        elements.push({ type: 'intro', text: content, key: `intro-${index}` });
      }
      return;
    }

    if (currentSection) {
      currentSection.items.push({ type: 'bullet', content: line });
    } else {
      elements.push({ type: 'intro', text: line, key: `intro-${index}` });
    }
  });

  flushSection();
  return elements;
};

const formatText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const SectionCard: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-brown-sidebar/40 border border-secondary-orange/30 rounded-xl p-4 max-md:p-3">
    {title && (
      <h2 className="text-lg max-md:text-[14px] font-bold uppercase tracking-[1px] text-primary-orange/90 mb-3 pb-2 border-b border-secondary-orange/60">
        {title}
      </h2>
    )}
    <div className="space-y-3">{children}</div>
  </div>
);

const KeyValueRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start">
      <span className="mr-3 mt-1 text-sm text-primary-orange/80">●</span>
      <div className="flex-1">
        <span className="font-semibold text-white max-md:text-[14px]">{label}:</span>
        <span className="text-white/90 ml-1 max-md:text-[14px] max-md:leading-[22px]">{value}</span>
      </div>
    </div>
  );
};

const renderCardObject = (card: Record<string, unknown>, idx: number): React.ReactNode => {
  const title = stringifyValue(card.cardName ?? card.name ?? '') || `Card ${idx + 1}`;
  const skip = new Set(['cardName', 'name', 'id', '_id', 'slug', 'image', 'imageUrl', 'applyLink']);

  const rows = Object.entries(card).filter(([k]) => !skip.has(k));

  return (
    <SectionCard key={`card-${idx}`} title={title}>
      {rows.length === 0 ? (
        <span className="text-white/70 text-sm">No additional details available.</span>
      ) : (
        rows.map(([k, v]) => {
          const value = stringifyValue(v);
          if (!value) return null;
          return <KeyValueRow key={k} label={humanize(k)} value={value} />;
        })
      )}
    </SectionCard>
  );
};

const JsonRenderer: React.FC<{ data: unknown }> = ({ data }) => {
  // Shape: { startMessage?, cards: [...] }
  if (isPlainCardObject(data) && Array.isArray((data as Record<string, unknown>).cards)) {
    const obj = data as Record<string, unknown>;
    const startMessage = stringifyValue(obj.startMessage ?? obj.message ?? '');
    const cards = obj.cards as unknown[];
    return (
      <div className="space-y-4">
        {startMessage && (
          <p className="text-white opacity-80 leading-relaxed text-base max-md:text-[14px]">
            {startMessage}
          </p>
        )}
        {cards
          .filter(isPlainCardObject)
          .map((card, idx) => renderCardObject(card, idx))}
      </div>
    );
  }

  // Shape: array of card objects
  if (Array.isArray(data)) {
    return (
      <div className="space-y-4">
        {data.filter(isPlainCardObject).map((card, idx) => renderCardObject(card, idx))}
      </div>
    );
  }

  // Shape: single card object
  if (isPlainCardObject(data)) {
    return <div className="space-y-4">{renderCardObject(data, 0)}</div>;
  }

  // Last-resort: pretty-print
  return (
    <pre className="text-white/80 text-sm whitespace-pre-wrap bg-brown-sidebar/40 border border-secondary-orange/30 rounded-xl p-4 overflow-x-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

const PlainTextFallback: React.FC<{ content: string }> = ({ content }) => (
  <Typography
    variant="body"
    className="text-left opacity-80 max-md:text-[14px] whitespace-pre-wrap leading-relaxed"
  >
    {content}
  </Typography>
);

const ContentRenderer: React.FC<ContentRendererProps> = ({ content }) => {
  if (!content?.trim()) return null;

  const parsed = tryParseJson(content);
  if (parsed !== null) {
    return (
      <div className="py-4">
        <JsonRenderer data={parsed} />
      </div>
    );
  }

  const elements = parseContent(content);
  const hasStructure = elements.some((e) => e.type === 'section' || e.type === 'standalone');

  if (!hasStructure) {
    return (
      <div className="py-4">
        <PlainTextFallback content={content} />
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="space-y-4">
        {elements.map((element) => {
          switch (element.type) {
            case 'intro':
              return (
                <p
                  key={element.key}
                  className="text-white max-md:text-[14px] opacity-80 leading-relaxed text-base"
                >
                  {formatText(element.text)}
                </p>
              );

            case 'section':
              return (
                <SectionCard key={element.key} title={element.title}>
                  {element.items.map((item, i) => (
                    <div key={i} className="leading-relaxed">
                      {item.type === 'subsection' ? (
                        <div className="flex items-start">
                          <span className="mr-3 mt-1 text-sm text-primary-orange/80">●</span>
                          <div className="flex-1">
                            <span className="font-semibold text-white max-md:text-[14px]">
                              {item.title}
                              {item.content ? ':' : ''}
                            </span>
                            {item.content && (
                              <span className="text-white/90 ml-1 max-md:text-[14px] max-md:leading-[22px]">
                                {formatText(item.content)}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start">
                          <span className="mr-3 mt-1 text-sm text-primary-orange/80">●</span>
                          <span className="text-white/90 flex-1 max-md:text-[14px] max-md:leading-[22px]">
                            {formatText(item.content)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </SectionCard>
              );

            case 'standalone':
              return (
                <div key={element.key} className="flex items-start ml-1">
                  <span className="mr-3 mt-1 text-sm max-md:text-[14px] text-primary-orange/80">●</span>
                  <div className="flex-1">
                    <span className="font-semibold text-white max-md:text-[14px]">{element.title}:</span>
                    <span className="text-white/90 ml-1 max-md:text-[14px] max-md:leading-[22px]">
                      {formatText(element.content)}
                    </span>
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

export default ContentRenderer;
