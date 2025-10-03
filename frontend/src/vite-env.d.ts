/// <reference types="vite/client" />

declare module '*.json?url' {
  const src: string;
  export default src;
}

declare module '*.xml?url' {
  const src: string;
  export default src;
}
