import { FaArrowAltCircleLeft } from 'react-icons/fa';
import { Link } from 'remix';

const BackButton = (url: { url: string }) => {
	return (
		<Link to={url.toString()} className='btn btn-reverse btn-back'>
			<FaArrowAltCircleLeft /> Back
		</Link>
	);
};

export default BackButton;
