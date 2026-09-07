import { memo } from 'react';
import { Environment } from '../../types';
import { VariableInput } from '../VariableInput';
import { isCurlCommand, parseCurl, ParsedCurl } from '../../utils/curlParser';

interface UrlInputProps {
  value: string;
  environment: Environment | null;
  onChange: (value: string) => void;
  onClick?: () => void;
  className?: string;
  onCurlParsed?: (parsed: ParsedCurl) => void;
}

function UrlInput({
  value,
  environment,
  onChange,
  onClick,
  className,
  onCurlParsed,
}: UrlInputProps) {
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (isCurlCommand(text)) {
      const parsed = parseCurl(text);
      if (parsed) {
        e.preventDefault();
        onCurlParsed?.(parsed);
      }
    }
  };

  return (
    <VariableInput
      value={value}
      environment={environment}
      onClick={onClick}
      onChange={onChange}
      onPaste={handlePaste}
      placeholder="https://api.example.com/resource or paste cURL"
      className={className}
      aria-label="Request URL"
    />
  );
}

export default memo(UrlInput);
