import type { ImgHTMLAttributes } from 'react';

type Props = ImgHTMLAttributes<HTMLImageElement> & { size?: number };

export default function BetterMatchLogo({
  size = 40,
  className,
  alt = 'BetterMatch',
  style,
  ...rest
}: Props) {
  return (
    <img
      src="/bettermatch-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      {...rest}
    />
  );
}
