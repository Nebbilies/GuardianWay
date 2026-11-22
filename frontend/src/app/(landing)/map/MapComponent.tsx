"use client";
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMapEvents,
} from "react-leaflet";
import { RefObject, useRef } from "react";
import L from "leaflet";

const markerIcon = L.icon({
    iconUrl: "/img/leaflet/marker-icon.png",
    iconRetinaUrl: "/img/leaflet/marker-icon-2x.png",
    shadowUrl: "/img/leaflet/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface MapDescendantProps {
    onMapClick?: (position: { lat: number; lng: number }) => void;
}

function MapDescendant({ onMapClick }: MapDescendantProps) {
    const map = useMapEvents({
        click(e) {
            if (onMapClick) {
                const position = map.wrapLatLng(e.latlng);
                onMapClick(position);
                map.flyTo(position, 14, {
                    duration: 1.2,
                });
            }
        },
    });
    return null;
}

interface MapComponentProps {
    mapHeight?: number | string;
    latLng?: { lat: number; lng: number } | null;
    setLatLng?: (position: { lat: number; lng: number }) => void;
    stopLocations?: { lat: number; lng: number }[];
}

export default function MapComponent({
    mapHeight = "80vh",
    latLng,
    setLatLng,
    stopLocations,
}: MapComponentProps) {
    const mapRef: RefObject<L.Map | null> = useRef<L.Map | null>(null);
    const heightStyle =
        typeof mapHeight === "number" ? `${mapHeight}px` : mapHeight;
    return (
        <MapContainer
            center={latLng ?? [10.832, 106.6297]}
            zoom={10}
            scrollWheelZoom={true}
            style={{ height: heightStyle, width: "100%" }}
            ref={mapRef}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapDescendant onMapClick={setLatLng} />
            {latLng && (
                <Marker position={latLng} icon={markerIcon}>
                    <Popup>Selected Location</Popup>
                </Marker>
            )}
            {stopLocations &&
                stopLocations.map((location, index) => (
                    <Marker key={index} position={location} icon={markerIcon}>
                        <Popup>Trạm #{index + 1}</Popup>
                    </Marker>
                ))}
        </MapContainer>
    );
}
