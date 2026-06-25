import React from 'react';

const ApiDocCodeBlock: React.FC<{ children: string }> = ({ children }) => (
  <pre className="bg-muted rounded-md p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed">
    <code className="text-foreground font-mono">{children}</code>
  </pre>
);

export default ApiDocCodeBlock;
