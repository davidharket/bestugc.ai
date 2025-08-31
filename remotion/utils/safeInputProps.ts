// Helper function to safely get input props in both render and Player contexts
import { getInputProps } from 'remotion';

export const safeGetInputProps = () => {
	try {
		return getInputProps();
	} catch (error) {
		// In Player context, getInputProps() is not available
		return {};
	}
};