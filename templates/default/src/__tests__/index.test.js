import jestConfig from '../../jest.config';
import Navigation from '../components/navigation';

import { h } from 'costro/dist/jsx';

// jest.mock('costro');
// jest.mock('costro/jsx');

let navigation;

beforeEach(() => {
	// document.body.append(<div></div>);

	navigation = Navigation();
});

afterEach(() => {
	// document.body.innerHTML = '';
	// jest.clearAllMocks();
});

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
