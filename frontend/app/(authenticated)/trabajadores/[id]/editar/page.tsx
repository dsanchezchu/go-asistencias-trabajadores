import EditarClient from './EditarClient'

export async function generateStaticParams() {
    return [{ id: '1' }]
}

export default function Page() {
    return <EditarClient />
}
