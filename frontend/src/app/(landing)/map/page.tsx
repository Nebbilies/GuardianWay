'use client'
import dynamic from 'next/dynamic'
import { useState } from "react";

const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false,
});

export default function MapPage() {
    const [latLng, setLatLng] = useState<{ lat: number, lng: number } | null>(null);

    return (
        <main className="min-h-screen bg-background flex flex-col items-center justify-center w-full p-4">
            <div className="relative flex flex-col bg-card rounded-xl shadow-md border border-border overflow-hidden w-2/3 items-center">
                <div className="h-full w-full z-0 flex items-center justify-center">
                    <MapComponent latLng={latLng} setLatLng={setLatLng} mapHeight="80vh" />
                </div>
                <div className="p-5 flex items-center justify-center bg-secondary/10 border-t border-border w-2/3">
                    {latLng ? (
                        <p className="text-lg font-medium text-foreground">
                            Tọa độ đã chọn: <span className="font-mono text-primary font-bold">{latLng.lat.toFixed(5)}, {latLng.lng.toFixed(5)}</span>
                        </p>
                    ) : (
                        <p className="w-full text-lg text-center text-muted-foreground italic p-4">
                            Chưa có tọa độ.
                        </p>
                    )}
                </div>

            </div>
        </main>
    )
}