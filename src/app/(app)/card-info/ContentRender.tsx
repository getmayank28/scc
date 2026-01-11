import Typography from '@/components/Typography/Typography';
import { normalizeString } from '@/lib/utils';
import React from 'react';

interface ContentRendererProps {
  content: string;
  name:string
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

const ContentRenderer: React.FC<ContentRendererProps> = ({ content, name }) => {
  const parseContent = (text: string): ParsedElement[] => {
    if (!text) return [];
    
    const lines = text.split('\n');
    const elements: ParsedElement[] = [];
    let currentSection: SectionElement | null = null;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) return;

      // Check for main section headers (lines starting and ending with **)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && !trimmedLine.startsWith('* **')) {
        // Save previous section if exists
        if (currentSection) {
          elements.push(currentSection);
        }
        
        const headerText = trimmedLine.replace(/\*\*/g, '');
        currentSection = {
          type: 'section',
          title: headerText,
          items: [],
          key: `section-${index}`
        };
        return;
      }

      // Check for bullet points (subsections)
      if (trimmedLine.startsWith('* ')) {
        const content = trimmedLine.substring(2);
        
        // Check if this bullet has a bold title (subsection)
        const boldMatch = content.match(/^\*\*(.*?)\*\*:\s*(.*)/);
        
        if (boldMatch) {
          // This is a subsection with title
          const subTitle = boldMatch[1];
          const subContent = boldMatch[2];
          
          if (currentSection) {
            currentSection.items.push({
              type: 'subsection',
              title: subTitle,
              content: subContent
            });
          } else {
            // Create a new section if none exists
            elements.push({
              type: 'standalone',
              title: subTitle,
              content: subContent,
              key: `standalone-${index}`
            });
          }
        } else {
          // Regular bullet point
          if (currentSection) {
            currentSection.items.push({
              type: 'bullet',
              content: content
            });
          }
        }
        return;
      }

      // Regular paragraph (intro text)
      if (!currentSection) {
        elements.push({
          type: 'intro',
          text: trimmedLine,
          key: `intro-${index}`
        });
      }
    });

    // Add the last section
    if (currentSection) {
      elements.push(currentSection);
    }

    return elements;
  };

  const formatText = (text: string): React.ReactNode => {
    // Handle bold text (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const elements = parseContent(content);

  return (
    <div className="py-6">
      <Typography variant='body' className='opacity-100 max-md:text-[14px] font-semibold text-left mb-2'>{normalizeString(name)}</Typography>
      <div className="space-y-6">
        {elements.map((element) => {
          switch (element.type) {
            case 'intro':
              return (
                <p key={element.key} className="text-white max-md:text-[14px] opacity-80 leading-relaxed text-base mb-6">
                  {formatText(element.text)}
                </p>
              );
            
            case 'section':
              return (
                <div key={element.key} className="mb-6">
                  <h2 className="text-lg max-md:text-[14px] font-bold uppercase tracking-[1px] text-primary-orange/90 mb-3 pb-2 border-b-2 border-secondary-orange">
                    {element.title}
                  </h2>
                  <div className="ml-4 space-y-3">
                    {element.items.map((item, i) => (
                      <div key={i} className="leading-relaxed">
                        {item.type === 'subsection' ? (
                          <div className="mb-2">
                            <div className="flex items-start">
                              <span className="mr-3 max-md:text-[14px] mt-1 text-sm">●</span>
                              <div className="flex-1">
                                <span className="font-semibold text-white max-md:text-[14px]">{item.title}:</span>
                                <span className="text-white ml-1 max-md:text-[14px] max-md:leading-[22px]">{item.content}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start">
                            <span className="text-white/80 mr-3 mt-1 max-md:text-[14px]">•</span>
                            <span className="text-white/90 flex-1 max-md:text-[14px]  max-md:leading-[22px]">{formatText(item.content)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            
            case 'standalone':
              return (
                <div key={element.key} className="mb-4 ml-4">
                  <div className="flex items-start">
                    <span className="mr-3 mt-1 text-sm max-md:text-[14px]">●</span>
                    <div className="flex-1">
                      <span className="font-semibold text-white max-md:text-[14px]">{element.title}:</span>
                      <span className="text-white ml-1 max-md:text-[14px] max-md:leading-[22px]">{element.content}</span>
                    </div>
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

export default ContentRenderer