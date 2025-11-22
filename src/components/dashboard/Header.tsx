import { useTranslation } from 'react-i18next';
import { Bell } from '@/components/animate-ui/icons/bell';
import { Search } from '@/components/animate-ui/icons/search';
import { Moon } from '@/components/animate-ui/icons/moon';
import { Sun } from '@/components/animate-ui/icons/sun';
import { Globe } from '@/components/animate-ui/icons/globe';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

import { useEffect, useState } from 'react';

export function Header() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check initial theme
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center w-1/3">
        <div className="relative w-full max-w-sm group">
          <div className="absolute left-2.5 top-2.5 text-muted-foreground">
            <Search className="h-4 w-4" animateOnHover />
          </div>
          <Input 
            type="search" 
            placeholder={t('dashboard.search')} 
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <AnimateIcon animateOnHover asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </Button>
            </AnimateIcon>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('id')}>
              Bahasa Indonesia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AnimateIcon animateOnHover asChild>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Sun className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </AnimateIcon>

        <AnimateIcon animateOnHover asChild>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
        </AnimateIcon>
      </div>
    </header>
  );
}
