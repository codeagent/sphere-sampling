import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import glsl from "highlight.js/lib/languages/glsl";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("glsl", glsl);

@Pipe({
  name: "syntax"
})
export class SyntaxPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, lang: string) {
    return this.sanitizer.bypassSecurityTrustHtml(
      hljs.highlight(lang, value).value
    );
  }
}
