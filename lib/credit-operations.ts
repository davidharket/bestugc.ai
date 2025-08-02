import { refreshSessionGlobally } from './session-refresh';

// Wrapper for operations that spend credits
export async function spendCredits<T>(operation: () => Promise<T>): Promise<T> {
  try {
    const result = await operation();
    
    // Refresh session data to show updated credits
    await refreshSessionGlobally();
    
    return result;
  } catch (error) {
    // Still refresh on error in case credits were partially deducted
    await refreshSessionGlobally();
    throw error;
  }
}

// Wrapper for credit purchase operations
export async function purchaseCredits<T>(operation: () => Promise<T>): Promise<T> {
  try {
    const result = await operation();
    
    // Refresh session data to show updated credits
    await refreshSessionGlobally();
    
    return result;
  } catch (error) {
    throw error;
  }
}

// Wrapper for subscription operations
export async function updateSubscription<T>(operation: () => Promise<T>): Promise<T> {
  try {
    const result = await operation();
    
    // Refresh session data to show updated plan/credits
    await refreshSessionGlobally();
    
    return result;
  } catch (error) {
    throw error;
  }
}