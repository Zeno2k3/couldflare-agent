import React from 'react';
import { ChartRenderer } from './ChartRenderer';

interface MessageContentProps {
 content: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
 // Function to parse content and separate charts from text
 const parseContent = () => {
  const parts = [];
  const chartRegex = /:::chart([\s\S]*?):::/g;
  let lastIndex = 0;
  let match;

  while ((match = chartRegex.exec(content)) !== null) {
   // Add text before the chart
   if (match.index > lastIndex) {
    parts.push({
     type: 'text',
     content: content.substring(lastIndex, match.index)
    });
   }

   // Add chart data
   try {
    const chartData = JSON.parse(match[1]);
    parts.push({
     type: 'chart',
     data: chartData
    });
   } catch (e) {
    console.error('Failed to parse chart data:', e);
    parts.push({
     type: 'text',
     content: match[0] // Render as text if parsing fails
    });
   }

   lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
   parts.push({
    type: 'text',
    content: content.substring(lastIndex)
   });
  }

  return parts;
 };

 const parts = parseContent();

 if (parts.length === 0) {
  return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
 }

 return (
  <div className="space-y-4">
   {parts.map((part, index) => {
    if (part.type === 'chart') {
     return <ChartRenderer key={index} config={part.data} />;
    }
    return (
     <p key={index} className="whitespace-pre-wrap leading-relaxed">
      {part.content}
     </p>
    );
   })}
  </div>
 );
};
