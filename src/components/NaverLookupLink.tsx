type NaverLookupLinkProps = {
  query: string;
};

export function NaverLookupLink({ query }: NaverLookupLinkProps) {
  const href = `https://korean.dict.naver.com/koendict/#/search?query=${encodeURIComponent(query)}`;
  return (
    <a className="inline-link" href={href} target="_blank" rel="noopener noreferrer">
      Naver lookup
    </a>
  );
}
