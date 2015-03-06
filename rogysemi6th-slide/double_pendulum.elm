import Signal
import List
import Graphics.Element(Element)
import Graphics.Collage as G
import Time as T
import Color
import Debug

-- model

pendulum = { m1 = 0.1, m2 = 0.1, l1 = 1, l2 = 1, g = 9.8 }

--- Type Aliases
type alias VecN = List Float
type alias Time = Float
type alias Step = Float
type alias Dynamics = Time -> VecN -> VecN

-- Operators for VecN
(+++) : VecN -> VecN -> VecN
xs +++ ys = List.map2 (+) xs ys
(***) : Float -> VecN -> VecN
k *** ys = List.map (\x -> k * x) ys
infixr 2 +++
infixr 3 ***

--- calc
rungeKutta : Dynamics -> Step -> Dynamics
rungeKutta f h t y =
    let
        k1 = f t (y)
        k2 = f t (y +++ h/2 *** k1)
        k3 = f t (y +++ h/2 *** k2)
        k4 = f t (y +++ h   *** k3)
    in
        y +++ h/6 *** (k1 +++ 2 *** k2 +++ 2 *** k3 +++ k4)

pendulaDynamics t [u1, u2, v1, v2] =
    let
        {m1, m2, l1, l2, g} = pendulum
        (m, l, w2) = (m2 / (m1 + m2), l2/l1, sqrt(g/l1))
        (c, s) = (cos(u1 - u2), sin(u1 - u2))
    in Debug.watch "dynamics" [
        v1, -- du1/dt
        v2, -- du2/dt
        (w2*l*(m*c*sin(u2)-sin(u1)) - m*l*(v1*v1*c + l*v2*v2)*s) / (l - m*l*c*c), -- dv1/dt
        (w2*c*sin(u1) - w2*sin(u2) + (v1*v1+m*l*v2*v2*c)*s) / (l - m*l*c*c) -- dv2/dt
    ]

pendulaDynamics' : Dynamics
pendulaDynamics' = rungeKutta pendulaDynamics 0.1

main : Signal Element
main = Signal.foldp pendulaDynamics' [0,-3,0,0] (T.fps 60)
       |> Signal.map (\(t1::t2::_) -> (t1,t2))
       |> Signal.map (scene (500, 500))

scene : (Int, Int) -> (Float, Float) -> Element
scene (w,h) (t1, t2) =
    let
        (l1, l2) = (pendulum.l1*100, pendulum.l2*100)
        (from1, to1) = ((0,0), (l1*sin(t1), -l1*cos(t1)))
        (from2, to2) = (to1, ((fst to1) + l2*sin(t2),(snd to1) - l2*cos(t2)))
        string1 = G.segment from1 to1 |>
                  G.traced (G.solid Color.blue)
        string2 = G.segment from2 to2 |>
                  G.traced (G.solid Color.red)
        ball1   = G.circle 10.0 |> G.filled Color.blue |> G.move to1
        ball2   = G.circle 10.0 |> G.filled Color.red  |> G.move to2
    in
        G.collage w h <| List.map (G.moveY 200) [
            string1, string2, ball1, ball2
        ]
