import { ReactElement } from 'react';

declare module 'wouter' {
  import { ComponentProps } from 'react';

  export function Link(props: ComponentProps<'a'> & { to: string; children?: any }): ReactElement | null;
  export function Route(props: { path?: string; component?: any; children?: any }): ReactElement | null;
  export function useLocation(): [string, (next: string) => void];
  export function useRoute(path: string): [boolean, Record<string, string> | null];
}
