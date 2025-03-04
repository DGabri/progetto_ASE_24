import { useState, useEffect, useContext } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
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
import goldIcon from '../assets/gold-icon.svg'
import GiftBoxAnimation from "./GiftBoxAnimation"
import getPull from '../services/getPull'
import getUserGold from '../services/getUserGold'
import { UserContext } from '../App'

const Banners = ({ setUser, showAlert, refillUserGold }) => {
    const [banners, setBanners] = useState([])
    const [pieces, setPieces] = useState([])
    const [displayPull, setDisplayPull] = useState(false)
    const [piecesPulled, setPiecesPulled] = useState({})
    const user = useContext(UserContext)

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

    useEffect(() => () => document.body.classList.remove("overflow-hidden"), [])

    useEffect(() => {
        if (user.logged) {
            getBanners(user.access_token).then(res => {
                setBanners(res)
            }).catch(error => showAlert("danger", error.toString()))

            getAllPieces(user.access_token).then(res => {
                setPieces(res)
            }).catch(error => showAlert("danger", error.toString()))
        }
        
    }, [user.logged])

    const changeDisplayInfo = (value, index) => {
        setDisplayInfo(displayInfo.map((displayInfo, i) => i == index ? value : displayInfo))
    }

    const getRate = (rates, pieces, grade) => {
        const rate = rates[gradesName[grade]] / pieces.filter(piece => piece.grade == grade).length
        return rate
    }

    const startPullAnimation = () => {
        document.body.classList.add("overflow-hidden")
        setDisplayPull(true)
    }

    const pullPiece = (banner) => {
        if (user.gold < banner.cost) {
            showAlert("warning", "Insufficient amount of gold.")
            return
        }

        getPull(user.access_token, banner.id).then(res => {
            setPiecesPulled(res)
            startPullAnimation()

            getUserGold(user.access_token, user.id).then(res => {
                setUser(prev => ({
                    ...prev,
                    gold: res
                }))
            }).catch(error => showAlert("danger", error.toString()))
        }).catch(error => showAlert("danger", error.toString()))
    }

    const closePull = () => {
        document.body.classList.remove("overflow-hidden")
        setDisplayPull(false)
    }

    return <>
        {displayPull && <GiftBoxAnimation
            pieces = {piecesPulled}
            closePull = {closePull}
        />}
        {!displayPull && <>
            <div className="position-absolute m-5 z-1 p-2">
                <Card className="d-inline-block w-auto" body>
                    {user.gold}
                    <img width="20" className="ms-2" src={goldIcon} />
                </Card>
                <Button className="ms-3" variant="secondary" onClick={refillUserGold}>+</Button>
            </div>
            <Container className="d-flex align-items-center justify-content-center position-absolute top-50 start-50 translate-middle mt-5">
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
            </Container>
        </>}
    </>
} 
export default Banners