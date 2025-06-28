export function ThemeScript() {
  const script = `
    (function() {
      try {
        const savedTheme = localStorage.getItem('phrase-forge-settings');
        if (savedTheme) {
          const settings = JSON.parse(savedTheme);
          const theme = settings?.state?.theme || 'system';
          
          let appliedTheme = theme;
          if (theme === 'system') {
            appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          
          if (appliedTheme === 'dark') {
            document.documentElement.classList.add('dark');
          }
        }
      } catch (e) {
        // エラーが発生しても何もしない（デフォルトのライトテーマを使用）
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}