'use client'
import {MapContainer, Marker, Popup, TileLayer, useMapEvents} from "react-leaflet";
import {RefObject, useRef, useState} from "react";
import L, {latLng, LatLng} from "leaflet";

interface MapDescendantProps {
    onMapClick?: (position: { lat: number, lng: number }) => void;
}

function MapDescendant({ onMapClick }: MapDescendantProps) {
    const map = useMapEvents({
        click(e) {
            if (onMapClick) {
                onMapClick(e.latlng);
                map.flyTo(e.latlng, 1, {
                    duration: 1.2
                })
            }
        }
    })
    return null;
}

interface MapComponentProps {
    mapHeight?: number | string;
    latLng?: { lat: number, lng: number } | null;
    setLatLng?: (position: { lat: number, lng: number }) => void;
    stopLocations?: { lat: number, lng: number }[];
}

export default function MapComponent({ mapHeight = "80vh", latLng, setLatLng, stopLocations }: MapComponentProps) {
    const mapRef: RefObject<L.Map | null> = useRef<L.Map | null>(null);
    const heightStyle = typeof mapHeight === 'number' ? `${mapHeight}px` : mapHeight;
    return (
            <MapContainer center={[10.832, 106.6297]} zoom={10} scrollWheelZoom={true}
                          style={{ height: heightStyle, width: "100%" }} ref={mapRef}>
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
                {stopLocations && stopLocations.map((location, index) => (
                    <Marker key={index} position={location}>
                        <Popup>
                            Trạm #{index + 1}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
    )
}


