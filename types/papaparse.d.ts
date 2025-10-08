declare module 'papaparse' {
  export type ParseError = {
    type: string;
    code: string;
    message: string;
    row: number;
  };

  export type ParseMeta = {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields?: string[];
  };

  export type ParseResult<T> = {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  };

  export type TransformHeaderFunction = (header: string) => string;

  export type CompleteFunction<T> = (results: ParseResult<T>) => void;

  export interface ParseConfig<T> {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    dynamicTyping?: boolean | Record<string, boolean>;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    download?: boolean;
    downloadRequestHeaders?: Record<string, string>;
    skipEmptyLines?: boolean | 'greedy';
    fastMode?: boolean;
    transform?: (value: string, field?: string | number) => string;
    transformHeader?: TransformHeaderFunction;
    step?: CompleteFunction<T>;
    complete?: CompleteFunction<T>;
    error?: (error: ParseError) => void;
  }

  export type Parse = <T>(input: string | File, config?: ParseConfig<T>) => ParseResult<T>;

  export type Unparse = (data: unknown, config?: Record<string, unknown>) => string;

  export const parse: Parse;
  export const unparse: Unparse;

  const Papa: {
    parse: Parse;
    unparse: Unparse;
  };

  export default Papa;
}
