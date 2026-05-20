'use client'

import { useRouter } from 'next/navigation';

export function ClickableRow({ 
  href, 
  children, 
  className 
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string; 
}) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const target = e.target as HTMLElement;
    // Prevent navigation if the user is interacting with links, buttons, select menus, or icons
    if (
      target.closest('a') || 
      target.closest('button') || 
      target.closest('select') || 
      target.closest('option') ||
      target.closest('input')
    ) {
      return;
    }
    router.push(href);
  };

  return (
    <tr 
      onClick={handleClick} 
      className={`${className} cursor-pointer`}
    >
      {children}
    </tr>
  );
}
