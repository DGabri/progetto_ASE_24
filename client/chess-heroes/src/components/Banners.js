import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import chessPiece from '../assets/chess-piece.svg'
import pack from '../assets/pack.svg'
import auction from '../assets/auction.svg'
import { useState, useEffect } from 'react'
import getBanners from '../services/getBanners'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import baseBanner from '../assets/base-banner.jpg'
import megaBanner from '../assets/mega-banner.jpg'
import superBanner from '../assets/super-banner.jpg'
import infoIcon from '../assets/info-icon.svg'
import crossIcon from '../assets/cross-icon.svg'
import getAllPieces from '../services/getAllPieces'
import kingWhite from '../assets/king-white.png'
import queenWhite from '../assets/queen-white.png'
import knightWhite from '../assets/knight-white.png'
import rookWhite from '../assets/rook-white.png'
import bishopWhite from '../assets/bishop-white.png'
import pawnWhite from '../assets/pawn-white.png'
import GiftBoxAnimation from "./GiftBoxAnimation"
import getPull from '../services/getPull'

const Banners = () => {
    const [banners, setBanners] = useState([])
    const [pieces, setPieces] = useState([])
    const [displayPull, setDisplayPull] = useState(false)
    const [piecesPulled, setPiecesPulled] = useState({})

    const [displayInfo, setDisplayInfo] = useState([
        false,
        false,
        false
    ])

    const bannersImage = {
        "base": baseBanner,
        "mega": megaBanner,
        "super": superBanner
    }

    const piecesImage = {
        "king": kingWhite,
        "queen": queenWhite,
        "knight": knightWhite,
        "rook": rookWhite,
        "bishop": bishopWhite,
        "pawn": pawnWhite,
    }

    const gradesName = {
        "C": "common",
        "R": "rare",
        "SR": "super_rare"
    }

    useEffect(() => {
        getBanners().then(res => {
            setBanners(res)
        }).catch(error => console.error(error))
    }, [])

    useEffect(() => {
        getAllPieces().then(res => {
            setPieces(res)
        }).catch(error => console.error(error))
    }, [])

    function changeDisplayInfo(value, index) {
        setDisplayInfo(displayInfo.map((displayInfo, i) => i == index ? value : displayInfo))
    }

    function getRate(rates, pieces, grade) {
        const rate = rates[gradesName[grade]] / pieces.filter(piece => piece.grade == grade).length
        return rate
    }

    function startPullAnimation() {
        document.body.classList.add("overflow-hidden")
        setDisplayPull(true)
    }

    async function pullPiece(banner) {
        const pieces = await getPull(banner)
        setPiecesPulled(pieces)
        startPullAnimation()
    }

    return <>
        {displayPull && <GiftBoxAnimation
            pieces = {piecesPulled}
            closePullScreen = {() => setDisplayPull(false)}
        />}
        {!displayPull && <Container style={{padding: "100px"}}>
            <Row>
                {banners.map((banner, index) => (
                    <>
                        {!displayInfo[index] && <Col>
                            <Card style={{width: "18rem", height: "28rem"}}>
                                <img width="45" src={infoIcon} onClick={() => changeDisplayInfo(true, index)} className="position-absolute" style={{cursor: "pointer"}} />
                                <Card.Img variant="top" src={bannersImage[banner.pic]} style={{backgroundSize: "contain"}} />
                                <Card.Body className="d-flex flex-column justify-content-center">
                                    <Card.Title>
                                        <h4 className="text-center">{banner.name}</h4>
                                    </Card.Title>
                                    <Card.Text className="text-center">{banner.pieces_num} Piece{banner.pieces_num != 1 ? "s" : ""}</Card.Text>
                                    <Button variant="primary mx-auto" onClick={() => pullPiece(banner)}>{banner.cost} Gold</Button>
                                </Card.Body>
                            </Card>
                        </Col>}
                        {displayInfo[index] && <Col>
                            <Card style={{width: "18rem", height: "28rem"}}>
                                <img width="45" src={crossIcon} onClick={() => changeDisplayInfo(false, index)} style={{cursor: "pointer"}} />
                                <Container className="py-4 px-5 gap-1 d-flex flex-column">
                                    {pieces.map(piece => (
                                        <Row>
                                            <Col className="col-auto">
                                                <img width="30" src={piecesImage[piece.pic]} />
                                            </Col>
                                            <Col className="d-flex align-items-center">
                                                <h6 className="m-0">{piece.name}</h6>
                                            </Col>
                                            <Col className="d-flex align-items-center justify-content-end">
                                                <h6 className="m-0">{getRate(banner.rates, pieces, piece.grade) * 100}%</h6>
                                            </Col>
                                        </Row>
                                    ))}
                                </Container>
                            </Card>
                        </Col>}
                    </>
                ))}
            </Row>
        </Container>}
    </>
} 
export default Banners