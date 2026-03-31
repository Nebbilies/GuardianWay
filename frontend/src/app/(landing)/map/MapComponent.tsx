'use client'
import {MapContainer, Marker, Popup, TileLayer, useMapEvents} from "react-leaflet";
import {RefObject, useRef, useState} from "react";
import L, {latLng, LatLng} from "leaflet";

interface MapDescendantProps {
    onMapClick: (position: { lat: number, lng: number }) => void;
}

function MapDescendant({ onMapClick }: MapDescendantProps) {
    const map = useMapEvents({
        click(e) {
            onMapClick(e.latlng);
            map.flyTo(e.latlng, 17, {
                duration: 1.2
            })
        }
    })
    return null;
}

interface MapComponentProps {
    mapHeight: number;
    latLng: { lat: number, lng: number } | null;
    setLatLng: (position: { lat: number, lng: number }) => void;
}

export default function MapComponent({ mapHeight, latLng, setLatLng }: MapComponentProps) {
    const mapRef: RefObject<L.Map | null> = useRef<L.Map | null>(null);
    return (
            <MapContainer center={[10.832, 106.6297]} zoom={10} scrollWheelZoom={true}
                          style={{ height: `${mapHeight}px`, width: "100%" }} ref={mapRef}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapDescendant onMapClick={setLatLng}/>
                {latLng && (
                    <Marker position={latLng}>
                        <Popup>
                            Selected Location
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
    )
}


