import LandingPage from './_components/landing-page'
import {getLandingProof} from './_lib/get-landing-proof'

export default async function Home() {
  const {data, isFallback} = await getLandingProof()

  return <LandingPage proof={data} isFallback={isFallback}/>
}
