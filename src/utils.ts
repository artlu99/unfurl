export const isValidUrl = (urlString: string) => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

export const safeFetch = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    const html = await res.text();
    return html;
  } catch (e) {
    return null;
  }
};
