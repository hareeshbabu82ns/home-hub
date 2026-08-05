"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  deleteNetworkDevice,
  getNetworkDevices,
  reviewNetworkDevice,
  scanNetworkDevices,
  toggleNetworkDeviceBlocked,
  updateNetworkDevice,
} from "@/lib/actions/network";
import type { NetworkDevice, UpdateNetworkDeviceInput } from "@/types/network";

export function useNetworkDevices() {
  const [ devices, setDevices ] = useState<NetworkDevice[]>( [] );
  const [ loading, setLoading ] = useState( true );
  const [ actionLoading, setActionLoading ] = useState( false );
  const [ search, setSearch ] = useState( "" );

  const loadDevices = useCallback( async ( searchValue?: string ) => {
    setLoading( true );
    const result = await getNetworkDevices( searchValue );

    if ( result.success && result.devices ) {
      setDevices( result.devices as NetworkDevice[] );
    } else {
      toast.error( result.error || "Failed to load devices" );
    }

    setLoading( false );
  }, [] );

  const scanDevices = useCallback( async ( subnet?: string ) => {
    setActionLoading( true );
    const result = await scanNetworkDevices( subnet );

    if ( result.success && result.devices ) {
      setDevices( result.devices as NetworkDevice[] );
      toast.success(
        `Scan complete: ${result.scannedCount || 0} scanned, ${result.newCount || 0} flagged new`,
      );
      setActionLoading( false );
      return true;
    }

    toast.error( result.error || "Failed to scan network" );
    setActionLoading( false );
    return false;
  }, [] );

  const saveDevice = useCallback( async ( input: UpdateNetworkDeviceInput ) => {
    setActionLoading( true );
    const result = await updateNetworkDevice( input );

    if ( result.success && result.device ) {
      setDevices( ( previous ) =>
        previous.map( ( device ) =>
          device.id === result.device.id
            ? ( { ...result.device } as NetworkDevice )
            : device,
        ),
      );
      toast.success( "Device updated" );
      setActionLoading( false );
      return true;
    }

    toast.error( result.error || "Failed to update device" );
    setActionLoading( false );
    return false;
  }, [] );

  const removeDevice = useCallback( async ( id: string ) => {
    setActionLoading( true );
    const result = await deleteNetworkDevice( id );

    if ( result.success ) {
      setDevices( ( previous ) => previous.filter( ( device ) => device.id !== id ) );
      toast.success( "Device removed" );
      setActionLoading( false );
      return true;
    }

    toast.error( result.error || "Failed to delete device" );
    setActionLoading( false );
    return false;
  }, [] );

  const markReviewed = useCallback( async ( id: string ) => {
    setActionLoading( true );
    const result = await reviewNetworkDevice( id );

    if ( result.success && result.device ) {
      setDevices( ( previous ) =>
        previous.map( ( device ) =>
          device.id === result.device.id
            ? ( { ...result.device } as NetworkDevice )
            : device,
        ),
      );
      toast.success( "Device marked as reviewed" );
      setActionLoading( false );
      return true;
    }

    toast.error( result.error || "Failed to update device" );
    setActionLoading( false );
    return false;
  }, [] );

  const toggleBlocked = useCallback( async ( id: string, isBlocked: boolean ) => {
    setActionLoading( true );
    const result = await toggleNetworkDeviceBlocked( { id, isBlocked } );

    if ( result.success && result.devices ) {
      setDevices( result.devices as NetworkDevice[] );
      toast.success( isBlocked ? "Device blocked" : "Device unblocked" );
      setActionLoading( false );
      return true;
    }

    toast.error( result.error || "Failed to update block status" );
    setActionLoading( false );
    return false;
  }, [] );

  return {
    devices,
    loading,
    actionLoading,
    search,
    setSearch,
    loadDevices,
    scanDevices,
    saveDevice,
    removeDevice,
    markReviewed,
    toggleBlocked,
  };
}
