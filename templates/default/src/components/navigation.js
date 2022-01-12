import { Link } from 'costro';
import { h } from 'costro/jsx';

export default function Navigation() {
	return (
		<div>
			<Link to="/">Home</Link>
			<Link to="/about">About</Link>
		</div>
	);
}
