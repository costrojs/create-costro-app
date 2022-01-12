import { Component } from 'costro';
import { h } from 'costro/jsx';
import Navigation from '../../components/navigation';
import './home.css';

export default class Home extends Component {
	render() {
		return (
			<div id="home">
				<Navigation />
				<h2>Home</h2>
			</div>
		);
	}
}
