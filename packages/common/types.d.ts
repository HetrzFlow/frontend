declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: {
    blurDataURL: string;
    blurHeight: number;
    blurWidth: number;
    height: number;
    src: string;
    width: number;
  };
  export default content;
}

declare module '*.webp' {
  const content: {
    blurDataURL: string;
    blurHeight: number;
    blurWidth: number;
    height: number;
    src: string;
    width: number;
  };
  export default content;
}

declare module '*.mp4' {
  const content: string;
  export default content;
}

declare module '*.module.css' {
  const styles: { [key: string]: string };
  export default styles;
}
