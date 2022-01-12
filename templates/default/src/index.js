import { App } from 'costro';
import Home from './pages/home';
import About from './pages/about';

const routes = [
	{
		path: '/',
		component: Home
	},
	{
		path: '/about',
		component: About
	}
];

new App({
	target: document.querySelector('#app'),
	routes,
	mode: 'history'
});
