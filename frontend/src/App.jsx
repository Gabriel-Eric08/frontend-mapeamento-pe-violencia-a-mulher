import React, { useState, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Form, Navbar, Badge, Accordion, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaFemale, FaShieldAlt, FaMapMarkerAlt, FaUsers, FaInfoCircle, FaChartBar } from 'react-icons/fa';
import MapaPernambuco from './MapaPernambuco';
import './App.css'; 

function App() {
  const [ano, setAno] = useState(2025);
  const [mes, setMes] = useState(1);
  const [municipioSelecionadoNome, setMunicipioSelecionadoNome] = useState(null);
  const [dadosGeojson, setDadosGeojson] = useState(null);

  // 1. CÁLCULOS TOTAIS
  const totaisEstado = useMemo(() => {
    if (!dadosGeojson || !dadosGeojson.features) return { violencia: 0, estupro: 0 };
    return dadosGeojson.features.reduce((acc, curr) => {
      return {
        violencia: acc.violencia + (curr.properties.violencia || 0),
        estupro: acc.estupro + (curr.properties.estupro || 0)
      };
    }, { violencia: 0, estupro: 0 });
  }, [dadosGeojson]);

  // 2. LISTA DE NOMES
  const listaMunicipios = useMemo(() => {
    if (!dadosGeojson || !dadosGeojson.features) return [];
    return dadosGeojson.features.map(f => f.properties.municipio).sort((a, b) => a.localeCompare(b));
  }, [dadosGeojson]);

  // 3. DETALHES SIMPLES
  const detalhesMunicipio = useMemo(() => {
    if (!dadosGeojson || !municipioSelecionadoNome) return null;
    return dadosGeojson.features.find(f => f.properties.municipio === municipioSelecionadoNome);
  }, [dadosGeojson, municipioSelecionadoNome]);

  // 4. ESTATÍSTICAS AVANÇADAS (RANKING)
  const statsMunicipio = useMemo(() => {
    if (!dadosGeojson || !municipioSelecionadoNome || !detalhesMunicipio) return null;

    const feats = [...dadosGeojson.features]; 
    const pop = detalhesMunicipio.properties.populacao || 1;
    const viol = detalhesMunicipio.properties.violencia || 0;
    const est = detalhesMunicipio.properties.estupro || 0;

    const getTaxa = (val, populacao) => (populacao > 1 ? (val / populacao) * 100000 : 0);

    // Sort e Find para Violência
    feats.sort((a, b) => (b.properties.violencia || 0) - (a.properties.violencia || 0));
    const rankViolAbs = feats.findIndex(f => f.properties.municipio === municipioSelecionadoNome) + 1;

    feats.sort((a, b) => getTaxa(b.properties.violencia, b.properties.populacao) - getTaxa(a.properties.violencia, a.properties.populacao));
    const rankViolProp = feats.findIndex(f => f.properties.municipio === municipioSelecionadoNome) + 1;

    // Sort e Find para Estupro
    feats.sort((a, b) => (b.properties.estupro || 0) - (a.properties.estupro || 0));
    const rankEstAbs = feats.findIndex(f => f.properties.municipio === municipioSelecionadoNome) + 1;

    feats.sort((a, b) => getTaxa(b.properties.estupro, b.properties.populacao) - getTaxa(a.properties.estupro, a.properties.populacao));
    const rankEstProp = feats.findIndex(f => f.properties.municipio === municipioSelecionadoNome) + 1;

    return {
      populacao: pop,
      taxaViolencia: getTaxa(viol, pop).toFixed(1),
      taxaEstupro: getTaxa(est, pop).toFixed(1),
      rankViolAbs,
      rankViolProp,
      rankEstAbs,
      rankEstProp,
      totalCidades: feats.length
    };
  }, [dadosGeojson, municipioSelecionadoNome, detalhesMunicipio]);

  const handleCarregarDados = (dados) => setDadosGeojson(dados);
  const handleMudarMunicipio = (e) => setMunicipioSelecionadoNome(e.target.value === "" ? null : e.target.value);
  const getTextoMes = () => (mes === 0 ? "Acumulado do Ano" : `${mes}/${ano}`);

  return (
    <div className="App bg-light min-vh-100">
      <Navbar bg="dark" variant="dark" className="shadow-sm mb-4">
        <Container fluid>
          <Navbar.Brand className="fw-bold d-flex align-items-center">
            <FaShieldAlt className="me-2" /> Monitoramento PE
          </Navbar.Brand>
        </Container>
      </Navbar>

      <Container fluid className="px-4">
        {/* --- HEADER DASHBOARD --- */}
        <Row className="mb-4 fade-in-down">
          <Col md={12}><h5 className="text-secondary fw-bold mb-3">Panorama Estadual ({getTextoMes()})</h5></Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm border-start border-4 border-danger h-100">
              <Card.Body>
                <h6 className="text-muted text-uppercase small fw-bold">Violência Doméstica (PE)</h6>
                <div className="d-flex align-items-center mt-2">
                  <FaFemale className="text-danger me-3" size={28}/>
                  <div><span className="h2 fw-bold mb-0 d-block">{totaisEstado.violencia.toLocaleString()}</span></div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm border-start border-4 border-dark h-100">
              <Card.Body>
                <h6 className="text-muted text-uppercase small fw-bold">Estupro (PE)</h6>
                <div className="d-flex align-items-center mt-2">
                  <FaShieldAlt className="text-dark me-3" size={28}/>
                  <div><span className="h2 fw-bold mb-0 d-block">{totaisEstado.estupro.toLocaleString()}</span></div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* --- ESQUERDA: MAPA E FILTROS --- */}
          <Col md={municipioSelecionadoNome ? 8 : 12} className="transition-all">
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body className="d-flex gap-3 align-items-end p-3 bg-white rounded flex-wrap">
                <div style={{ minWidth: '100px', flex: 1 }}>
                  <label className="small fw-bold text-muted mb-1">Ano</label>
                  <Form.Select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="fw-bold border-secondary">
                    <option value={2023}>2023</option><option value={2024}>2024</option><option value={2025}>2025</option>
                  </Form.Select>
                </div>
                <div style={{ minWidth: '180px', flex: 1 }}>
                  <label className="small fw-bold text-muted mb-1">Período</label>
                  <Form.Select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="fw-bold border-secondary">
                    <option value={0} className="fw-bold text-primary">-- Todos os Meses --</option>
                    <hr/>
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('pt-BR', {month: 'long'})}</option>)}
                  </Form.Select>
                </div>
                <div style={{ minWidth: '200px', flex: 2 }}>
                  <label className="small fw-bold text-muted mb-1">Município</label>
                  <Form.Select value={municipioSelecionadoNome || ""} onChange={handleMudarMunicipio} className="fw-bold border-primary text-primary" disabled={!dadosGeojson}>
                    <option value="">-- Ver Todo o Estado --</option>
                    {listaMunicipios.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                  </Form.Select>
                </div>
              </Card.Body>
            </Card>
            <div style={{ height: '600px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <MapaPernambuco ano={ano} mes={mes} municipioSelecionadoNome={municipioSelecionadoNome} aoSelecionar={setMunicipioSelecionadoNome} aoCarregarDados={handleCarregarDados} />
            </div>
          </Col>

          {/* --- DIREITA: DETALHES --- */}
          {municipioSelecionadoNome && detalhesMunicipio && statsMunicipio && (
            <Col md={4} className="fade-in-right">
              <Card className="shadow border-0 h-100 bg-white" style={{maxHeight: '750px', overflowY: 'auto'}}>
                <Card.Header className="bg-white border-0 pt-4 px-4 sticky-top">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                            <div className="bg-light p-2 rounded-circle me-3"><FaMapMarkerAlt className="text-primary" size={20}/></div>
                            <h4 className="mb-0 fw-bold text-primary">{municipioSelecionadoNome}</h4>
                        </div>
                    </div>
                    
                    {/* Botão simples para fechar/voltar */}
                    <button className="btn btn-sm btn-outline-secondary mt-1 w-100" onClick={() => setMunicipioSelecionadoNome(null)}>Voltar para Visão Geral</button>
                    <hr className="my-3"/>
                </Card.Header>
                
                <Card.Body className="px-4 pb-4">
                  
                  {/* === PARTE 1: VISUALIZAÇÃO SIMPLES (COMO ANTES) === */}
                  
                  {/* Card Violência (Simples) */}
                  <div className="p-3 mb-3 rounded-3 bg-danger bg-opacity-10 border-start border-5 border-danger">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="text-danger mb-1 fw-bold">Violência Doméstica</h6>
                            <small className="text-muted">Neste município</small>
                        </div>
                        <div className="display-6 fw-bold text-danger">
                            {detalhesMunicipio.properties.violencia}
                        </div>
                    </div>
                  </div>

                  {/* Card Estupro (Simples) */}
                  <div className="p-3 mb-3 rounded-3 bg-dark bg-opacity-10 border-start border-5 border-dark">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="text-dark mb-1 fw-bold">Estupro</h6>
                            <small className="text-muted">Neste município</small>
                        </div>
                        <div className="display-6 fw-bold text-dark">
                            {detalhesMunicipio.properties.estupro}
                        </div>
                    </div>
                  </div>

                  {/* === PARTE 2: ANÁLISE AVANÇADA (EXPANSÍVEL) === */}
                  
                  <div className="mt-4">
                    <Accordion>
                        <Accordion.Item eventKey="0" className="border-0">
                            <Accordion.Header>
                                <div className="d-flex align-items-center text-secondary">
                                    <FaChartBar className="me-2"/> 
                                    <span className="fw-bold">Análise Avançada e Rankings</span>
                                </div>
                            </Accordion.Header>
                            <Accordion.Body className="bg-light rounded p-3 mt-2">
                                
                                {/* Info População */}
                                <div className="mb-3 text-center border-bottom pb-2">
                                    <small className="text-muted text-uppercase fw-bold">População Estimada</small>
                                    <div className="h5 fw-bold text-dark"><FaUsers className="me-2 text-secondary"/>{statsMunicipio.populacao.toLocaleString()}</div>
                                </div>

                                {/* Bloco Violência Avançado */}
                                <h6 className="small fw-bold text-danger mt-3">VIOLÊNCIA DOMÉSTICA</h6>
                                <div className="bg-white p-2 rounded shadow-sm border mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <small>Ranking Absoluto:</small> 
                                        <strong className="text-danger">{statsMunicipio.rankViolAbs}º</strong>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <small>Ranking Proporcional:</small>
                                            <OverlayTrigger overlay={<Tooltip>Rank baseado na taxa por 100k habitantes</Tooltip>}>
                                                <span className="ms-1"><FaInfoCircle size={10} className="text-muted"/></span>
                                            </OverlayTrigger>
                                        </div>
                                        <strong className="text-danger">{statsMunicipio.rankViolProp}º</strong>
                                    </div>
                                    <div className="text-end mt-1"><small className="text-muted" style={{fontSize: '11px'}}>({statsMunicipio.taxaViolencia} casos / 100k hab)</small></div>
                                </div>

                                {/* Bloco Estupro Avançado */}
                                <h6 className="small fw-bold text-dark mt-3">ESTUPRO</h6>
                                <div className="bg-white p-2 rounded shadow-sm border">
                                    <div className="d-flex justify-content-between mb-1">
                                        <small>Ranking Absoluto:</small> 
                                        <strong className="text-dark">{statsMunicipio.rankEstAbs}º</strong>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <small>Ranking Proporcional:</small>
                                            <OverlayTrigger overlay={<Tooltip>Rank baseado na taxa por 100k habitantes</Tooltip>}>
                                                <span className="ms-1"><FaInfoCircle size={10} className="text-muted"/></span>
                                            </OverlayTrigger>
                                        </div>
                                        <strong className="text-dark">{statsMunicipio.rankEstProp}º</strong>
                                    </div>
                                    <div className="text-end mt-1"><small className="text-muted" style={{fontSize: '11px'}}>({statsMunicipio.taxaEstupro} casos / 100k hab)</small></div>
                                </div>

                                <div className="mt-3 text-center">
                                    <small className="text-muted" style={{fontSize: '10px'}}>Comparação entre {statsMunicipio.totalCidades} municípios.</small>
                                </div>

                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                  </div>

                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
}

export default App;