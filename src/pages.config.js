import Landing from './pages/Landing';
import OurWhy from './pages/OurWhy';
import ALIVEMethod from './pages/ALIVEMethod';
import Experts from './pages/Experts';
import Apply from './pages/Apply';
import Contact from './pages/Contact';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Landing": Landing,
    "OurWhy": OurWhy,
    "ALIVEMethod": ALIVEMethod,
    "Experts": Experts,
    "Apply": Apply,
    "Contact": Contact,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};