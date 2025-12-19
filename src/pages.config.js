import Landing from './pages/Landing';
import OurWhy from './pages/OurWhy';
import ALIVEMethod from './pages/ALIVEMethod';
import Experts from './pages/Experts';
import Apply from './pages/Apply';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Landing": Landing,
    "OurWhy": OurWhy,
    "ALIVEMethod": ALIVEMethod,
    "Experts": Experts,
    "Apply": Apply,
    "Contact": Contact,
    "Dashboard": Dashboard,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};