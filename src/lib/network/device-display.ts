interface DeviceNameFields {
  name?: string | null;
  dhcpHostname?: string | null;
  hostname?: string | null;
  vendor?: string | null;
  ipAddress: string;
}

/** User label → DHCP hostname → resolved hostname → vendor → IP. */
export function getDeviceDisplayName( device: DeviceNameFields ): string {
  return (
    device.name?.trim() ||
    device.dhcpHostname?.trim() ||
    device.hostname?.trim() ||
    device.vendor?.trim() ||
    device.ipAddress
  );
}

/** Whether the name came from the user or the network (vs. a fallback). */
export function hasRealDeviceName( device: DeviceNameFields ): boolean {
  return !!(
    device.name?.trim() ||
    device.dhcpHostname?.trim() ||
    device.hostname?.trim()
  );
}
