import Navigation from '../components/navigation';
import { h } from 'costro/jsx';

describe('Navigation constructor', () => {
	it('Should call the navigation function', () => {
		const result = Navigation();

		expect(result).toStrictEqual(
			<div>
				<a href="/">Home</a>
				<a href="/about">About</a>
			</div>
		);
	});
});
