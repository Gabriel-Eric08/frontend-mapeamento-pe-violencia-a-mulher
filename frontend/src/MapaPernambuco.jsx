import React, { useEffect, useState } from 'react';
import { MapContainer, GeoJSON, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spinner, Alert } from 'react-bootstrap';

// Componente auxiliar de Zoom (sem alterações na lógica)
const AjustarZoom = ({ dados, selecionadoNome }) => {
  const map = useMap();
  useEffect(() => {
    if (!dados) return;
    if (selecionadoNome) {
      const featureAlvo = dados.features.find(f => f.properties.municipio === selecionadoNome);
      if (featureAlvo) {
        const layer = L.geoJSON(featureAlvo);
        try { map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 12 }); } catch (e) {}
      }
      map.invalidateSize();
    } else {
      const layer = L.geoJSON(dados);
      try { map.fitBounds(layer.getBounds(), { padding: [20, 20] }); } catch (e) {}
      map.invalidateSize();
    }
  }, [dados, selecionadoNome, map]);
  return null;
};

const MapaPernambuco = ({ ano, mes, municipioSelecionadoNome, aoSelecionar, aoCarregarDados }) => {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Busca dados do Backend Flask
  useEffect(() => {
    setLoading(true);
    setError(null);
    // A rota agora retorna o geojson já preenchido com violencia e estupro
    fetch(`http://172.16.212.11:5000/api/mapa/${ano}/${mes}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        setGeoData(data);
        setLoading(false);
        if (aoCarregarDados) aoCarregarDados(data);
      })
      .catch(e => {
        console.error(e);
        setError("Erro ao carregar dados do servidor.");
        setLoading(false);
      });
  }, [ano, mes]);

  // Estilo baseado na Violência (ou soma, se preferir mudar no backend)
  const styleMunicipios = (feature) => {
    const nomeAtual = feature.properties.municipio;
    
    // Se há uma cidade selecionada, as outras ficam transparentes
    if (municipioSelecionadoNome && nomeAtual !== municipioSelecionadoNome) {
        return { fillColor: '#fff', fillOpacity: 0, color: 'transparent', weight: 0 };
    }

    // Usa 'valor' que o backend definiu (atualmente Violência Doméstica)
    const valor = feature.properties.valor || 0;
    
    let cor = '#fee5d9'; // cor base (clara)
    if (valor > 0) cor = '#fcae91';
    if (valor > 5) cor = '#fb6a4a';
    if (valor > 10) cor = '#de2d26';
    if (valor > 20) cor = '#a50f15';

    const isSelected = municipioSelecionadoNome && nomeAtual === municipioSelecionadoNome;

    return {
      fillColor: cor,
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#000' : '#666',
      fillOpacity: 0.7 
    };
  };

  const onEachFeature = (feature, layer) => {
    const nome = feature.properties.municipio;
    const viol = feature.properties.violencia || 0;
    const est = feature.properties.estupro || 0;
    
    // Tooltip HTML personalizado
    if (!municipioSelecionadoNome) {
        layer.bindTooltip(`
          <div style="text-align:center; font-family: sans-serif;">
            <strong style="font-size: 14px;">${nome}</strong><br/>
            <div style="margin-top:4px; font-size:12px;">
              <span style="color:#d32f2f">Violência: <b>${viol}</b></span><br/>
              <span style="color:#212529">Estupro: <b>${est}</b></span>
            </div>
          </div>
        `, { sticky: true, direction: 'top' });
    }
    
    layer.on({
      click: () => aoSelecionar(nome),
      mouseover: (e) => {
        if (!municipioSelecionadoNome) {
            e.target.setStyle({ weight: 3, color: '#333', fillOpacity: 0.9 });
            e.target.bringToFront();
        }
      },
      mouseout: (e) => {
        if (!municipioSelecionadoNome) {
           e.target.setStyle({ weight: 1, color: '#666', fillOpacity: 0.7 });
        }
      }
    });
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary"/></div>;
  if (error) return <Alert variant="danger" className="m-3">{error}</Alert>;

  return (
    <MapContainer 
      center={[-8.4, -37.9]} 
      zoom={7.5} 
      style={{ height: '100%', width: '100%', background: '#f8f9fa' }} 
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {geoData && (
        <>
            <GeoJSON 
                key={`${ano}-${mes}-${municipioSelecionadoNome || 'all'}`} 
                data={geoData} 
                style={styleMunicipios} 
                onEachFeature={onEachFeature} 
            />
            <AjustarZoom dados={geoData} selecionadoNome={municipioSelecionadoNome} />
        </>
      )}
    </MapContainer>
  );
};

export default MapaPernambuco;