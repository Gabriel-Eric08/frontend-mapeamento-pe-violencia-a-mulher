import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, ProgressBar, Accordion, Badge } from 'react-bootstrap';
import { FaBalanceScale, FaChartPie } from 'react-icons/fa';

// Componente para renderizar a lista de detalhes (Tipos de crime)
const ListaDetalhes = ({ titulo, lista, cor }) => {
    if (!lista || lista.length === 0) return null;
    return (
        <div className="mt-3 mb-3">
            <h6 className={`small fw-bold text-${cor} text-uppercase border-bottom pb-1`}>{titulo} (Tipos)</h6>
            <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                {lista.map((item, idx) => (
                    <div key={idx} className="mb-2">
                        <div className="d-flex justify-content-between align-items-center" style={{fontSize: '0.85rem'}}>
                            <span className="text-truncate" title={item.tipo} style={{maxWidth: '70%'}}>
                                {item.tipo}
                            </span>
                            <span className="fw-bold">
                                {item.qtd} <small className="text-muted fw-normal">({item.pct}%)</small>
                            </span>
                        </div>
                        <ProgressBar variant={cor} now={item.pct} style={{height: '4px'}} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const SelectCenario = ({ titulo, valor, setValor, listaCidades }) => {
    const anos = Array.from({length: 11}, (_, i) => 2025 - i);
    const handleChange = (campo, v) => setValor(prev => ({ ...prev, [campo]: v }));

    return (
        <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white fw-bold text-primary border-bottom-0 pt-3">
                {titulo}
            </Card.Header>
            <Card.Body>
                <Form.Group className="mb-2">
                    <Form.Label className="small text-muted">Município</Form.Label>
                    <Form.Select 
                        value={valor.municipio} 
                        onChange={e => handleChange('municipio', e.target.value)}
                        className="fw-bold"
                    >
                        <option value="">Selecione...</option>
                        {listaCidades.map(c => <option key={c} value={c}>{c}</option>)}
                    </Form.Select>
                </Form.Group>
                <Row>
                    <Col>
                        <Form.Label className="small text-muted">Ano</Form.Label>
                        <Form.Select value={valor.ano} onChange={e => handleChange('ano', Number(e.target.value))}>
                            {anos.map(a => <option key={a} value={a}>{a}</option>)}
                        </Form.Select>
                    </Col>
                    <Col>
                        <Form.Label className="small text-muted">Mês</Form.Label>
                        <Form.Select value={valor.mes} onChange={e => handleChange('mes', Number(e.target.value))}>
                            <option value={0}>Ano Todo</option>
                            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                        </Form.Select>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

// ATENÇÃO: Troque pelo seu IP aqui se for rodar na rede
const API_URL = 'http://172.16.212.11:5000/api/comparar'; 

export default function Comparador({ listaCidades }) {
    const [cenarioA, setCenarioA] = useState({ municipio: 'RECIFE', ano: 2024, mes: 0 });
    const [cenarioB, setCenarioB] = useState({ municipio: 'CARUARU', ano: 2024, mes: 0 });
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(false);

    const comparar = async () => {
        if (!cenarioA.municipio || !cenarioB.municipio) return;
        setLoading(true);
        try {
            // Se estiver na rede, troque localhost pelo seu IP
            const response = await fetch(API_URL, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cenarioA, cenarioB })
            });
            const data = await response.json();
            setDados(data);
        } catch (error) {
            console.error(error);
            alert("Erro ao comparar. Verifique se o backend está rodando.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="fade-in-down pb-5">
            <div className="text-center mb-4 mt-3">
                <h3 className="fw-bold text-secondary"><FaBalanceScale className="me-2"/>Comparador Detalhado</h3>
                <p className="text-muted">Analise diferenças de volume, taxas e tipologias.</p>
            </div>

            <Row className="g-3 mb-4">
                <Col md={5}>
                    <SelectCenario titulo="Cenário A (Esquerda)" valor={cenarioA} setValor={setCenarioA} listaCidades={listaCidades} />
                </Col>
                <Col md={2} className="d-flex align-items-center justify-content-center">
                    <Button variant="primary" size="lg" className="rounded-circle p-3 shadow" onClick={comparar} disabled={loading}>
                        {loading ? '...' : 'VS'}
                    </Button>
                </Col>
                <Col md={5}>
                    <SelectCenario titulo="Cenário B (Direita)" valor={cenarioB} setValor={setCenarioB} listaCidades={listaCidades} />
                </Col>
            </Row>

            {dados && (
                <Row>
                    {/* COLUNA ESQUERDA - RESULTADOS A */}
                    <Col md={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <h4 className="text-primary fw-bold">{dados.cenarioA.municipio}</h4>
                                <Badge bg="light" text="dark" className="mb-3 border">
                                    {dados.cenarioA.mes === 0 ? 'Ano' : 'Mês ' + dados.cenarioA.mes}/{dados.cenarioA.ano}
                                </Badge>

                                <div className="p-3 bg-danger bg-opacity-10 rounded mb-3">
                                    <h2 className="text-danger fw-bold mb-0">{dados.cenarioA.violencia.total}</h2>
                                    <small className="text-muted fw-bold">Violência Doméstica (Total)</small>
                                </div>
                                <ListaDetalhes titulo="Tipos de Violência" lista={dados.cenarioA.violencia.detalhes} cor="danger" />

                                <hr/>

                                <div className="p-3 bg-dark bg-opacity-10 rounded mb-3">
                                    <h2 className="text-dark fw-bold mb-0">{dados.cenarioA.estupro.total}</h2>
                                    <small className="text-muted fw-bold">Estupro (Total)</small>
                                </div>
                                <ListaDetalhes titulo="Modalidades de Estupro" lista={dados.cenarioA.estupro.detalhes} cor="dark" />
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* COLUNA DIREITA - RESULTADOS B */}
                    <Col md={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <h4 className="text-primary fw-bold text-end">{dados.cenarioB.municipio}</h4>
                                <div className="text-end">
                                    <Badge bg="light" text="dark" className="mb-3 border">
                                        {dados.cenarioB.mes === 0 ? 'Ano' : 'Mês ' + dados.cenarioB.mes}/{dados.cenarioB.ano}
                                    </Badge>
                                </div>

                                <div className="p-3 bg-danger bg-opacity-10 rounded mb-3 text-end">
                                    <h2 className="text-danger fw-bold mb-0">{dados.cenarioB.violencia.total}</h2>
                                    <small className="text-muted fw-bold">Violência Doméstica (Total)</small>
                                </div>
                                <ListaDetalhes titulo="Tipos de Violência" lista={dados.cenarioB.violencia.detalhes} cor="danger" />

                                <hr/>

                                <div className="p-3 bg-dark bg-opacity-10 rounded mb-3 text-end">
                                    <h2 className="text-dark fw-bold mb-0">{dados.cenarioB.estupro.total}</h2>
                                    <small className="text-muted fw-bold">Estupro (Total)</small>
                                </div>
                                <ListaDetalhes titulo="Modalidades de Estupro" lista={dados.cenarioB.estupro.detalhes} cor="dark" />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
}