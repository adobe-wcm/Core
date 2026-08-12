javascript:(function(){var u=new URL(location.href);u.searchParams.set('wcmmode','disabled');location.href=u.href;})();

javascript:(function(){var u=new URL(location.href);u.searchParams.delete('wcmmode');location.href=u.href;})();

javascript:(function(){var u=new URL(location.href);if(u.pathname.indexOf('/content')===0){u.pathname='/editor.html'+u.pathname;location.href=u.href;}})();

javascript:(function(){var u=new URL(location.href);if(u.pathname.indexOf('/editor.html/')===0){u.pathname=u.pathname.replace('/editor.html','');location.href=u.href;}})();
