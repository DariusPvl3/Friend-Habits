import * as Network from "expo-network";

export async function checkIsOnline(): Promise<boolean> {
  const networkState = await Network.getNetworkStateAsync();
  return Boolean(
    networkState.isConnected && networkState.isInternetReachable !== false
  );
}