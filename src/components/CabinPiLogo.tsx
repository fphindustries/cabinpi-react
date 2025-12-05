interface CabinPiLogoProps {
  size?: number
}

export function CabinPiLogo({ size = 28 }: CabinPiLogoProps) {
  return (
    <img
      src="/favicon.svg"
      alt="CabinPi"
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  )
}
