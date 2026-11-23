/** Removes leftover italic markers (_like this_) that survived in older stored text. */
export function tidyOriginal(paragraph: string): string {
  return paragraph.replace(/_([^_]+)_/g, "$1").replace(/_/g, "");
}
